/*
Copyright (c) 2026 Red Hat Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
language governing permissions and limitations under the License.
*/

package servers

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	privatev1 "github.com/osac-project/osac/proto/gen/osac/private/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var _ = Describe("Private project membership create lifecycle guard", func() {
	It("rejects creating a membership when its project is being deleted", func() {
		seedTenantProject(testTenant, "membership-project")
		markProjectDeleting(testTenant, "membership-project")

		server, err := NewPrivateProjectMembershipsServer().
			SetLogger(logger).
			SetAttributionLogic(attribution).
			SetTenancyLogic(tenancy).
			Build()
		Expect(err).ToNot(HaveOccurred())

		_, err = server.Create(ctx, privatev1.ProjectMembershipsCreateRequest_builder{
			Object: privatev1.ProjectMembership_builder{
				Metadata: privatev1.Metadata_builder{
					Name:    "late-membership",
					Tenant:  testTenant,
					Project: "membership-project",
				}.Build(),
			}.Build(),
		}.Build())

		Expect(status.Code(err)).To(Equal(codes.FailedPrecondition))
		Expect(err).To(MatchError(ContainSubstring("project 'test-tenant/membership-project' is being deleted")))
	})
})
